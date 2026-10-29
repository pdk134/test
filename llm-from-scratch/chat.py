"""
命令行交互式聊天（REPL）：加载手写的 GPT，逐轮与你对话，验证效果。

用法：
  python chat.py                 # 加载 checkpoints/ 后进入交互
  python chat.py --train         # 若没有检查点，先自动训练一份
  python chat.py --maxn 120 --temp 0.9

进入后：
  直接输入文字并回车  -> 模型续写回答
  /reset             -> 清空对话上下文
  /temp 0.9          -> 设置温度
  /topk 40           -> 设置 top_k
  /topp 0.85         -> 设置 top_p
  /maxn 150          -> 设置本次生成长度
  /help              -> 查看命令
  /quit 或 /exit     -> 退出（Ctrl+C / Ctrl+Z 也可）

说明：这是从零实现的 base 语言模型（next-token 续写），
并不是经过指令微调的聊天模型，所以它是「接着你的话往下写」。
"""
import argparse
import sys

import torch

# 强制 stdout 使用 UTF-8，避免 Windows(GBK) 控制台打印中文/特殊字符时报错
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import generate as gen
import train as trn
from config import GPTConfig

CKPT_DIR = "checkpoints"


def print_help():
    print(
        "\n命令：\n"
        "  /reset      清空对话上下文\n"
        "  /temp  <v>  温度 (默认 0.8)\n"
        "  /topk  <v>  top_k (默认 50, 0=关闭)\n"
        "  /topp  <v>  top_p (默认 0.9, 1.0=关闭)\n"
        "  /maxn  <v>  生成长度 (默认 200)\n"
        "  /rep   <v>  重复惩罚 (默认 1.1, 1.0=关闭)\n"
        "  /help       显示本帮助\n"
        "  /quit|/exit 退出\n"
        "直接输入文字即可让模型续写回答。\n"
    )


def maybe_train_first(ckpt_dir):
    has_ckpt = (
        __import__("os").path.exists(f"{ckpt_dir}/tokenizer.json")
        and __import__("os").path.exists(f"{ckpt_dir}/model.pt")
    )
    if has_ckpt:
        return
    print("未找到检查点，开始自动训练一份（默认小配置，CPU 较慢请耐心等待）...")
    cfg = GPTConfig()
    cfg.max_iters = 500
    trn.run_training(
        cfg, "data/corpus_mixed.txt", ckpt_dir,
        progress_cb=lambda **kw: kw.get("msg") and print(kw["msg"]),
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", default=CKPT_DIR)
    ap.add_argument("--train", action="store_true", help="若无检查点则先训练")
    ap.add_argument("--temp", type=float, default=0.8)
    ap.add_argument("--topk", type=int, default=50)
    ap.add_argument("--topp", type=float, default=0.9)
    ap.add_argument("--maxn", type=int, default=200)
    ap.add_argument("--rep", type=float, default=1.1, help="重复惩罚(>1 抑制复读)")
    args = ap.parse_args()

    if args.train:
        maybe_train_first(args.ckpt)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    try:
        tok, model, cfg = gen.load_model(args.ckpt, device)
    except FileNotFoundError:
        print(f"未找到 {args.ckpt} 下的模型。请先运行 `python train.py` 或加 --train。")
        sys.exit(1)

    # 可调采样参数
    temp, top_k, top_p, max_n, rep = args.temp, args.topk, args.topp, args.maxn, args.rep

    print("=" * 60)
    print("  从零 LLM · 命令行交互  (输入 /help 查看命令, /quit 退出)")
    print("=" * 60)

    context = ""  # 累积的对话上下文
    while True:
        try:
            user = input("\n你> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n再见。")
            break

        if not user:
            continue
        if user in ("/quit", "/exit"):
            print("再见。")
            break
        if user == "/help":
            print_help()
            continue
        if user == "/reset":
            context = ""
            print("[上下文已清空]")
            continue
        if user.startswith("/temp"):
            try:
                temp = float(user.split()[1])
                print(f"[温度 -> {temp}]")
            except Exception:
                print("[用法: /temp 0.9]")
            continue
        if user.startswith("/topk"):
            try:
                top_k = int(user.split()[1])
                print(f"[top_k -> {top_k}]")
            except Exception:
                print("[用法: /topk 40]")
            continue
        if user.startswith("/topp"):
            try:
                top_p = float(user.split()[1])
                print(f"[top_p -> {top_p}]")
            except Exception:
                print("[用法: /topp 0.85]")
            continue
        if user.startswith("/maxn"):
            try:
                max_n = int(user.split()[1])
                print(f"[生成长度 -> {max_n}]")
            except Exception:
                print("[用法: /maxn 150]")
            continue
        if user.startswith("/rep"):
            try:
                rep = float(user.split()[1])
                print(f"[重复惩罚 -> {rep}]")
            except Exception:
                print("[用法: /rep 1.1]")
            continue

        # ---- 构造 prompt 并生成 ----
        prompt = context + "你: " + user + "\n她: "
        print("她> ", end="", flush=True)

        # 用 step_callback 逐字符流式打印
        shown = 0

        def step(cont):
            nonlocal shown
            delta = cont[shown:]
            shown = len(cont)
            print(delta, end="", flush=True)

        full = gen.generate(
            tok, model, cfg, prompt,
            max_new=max_n, temperature=temp,
            top_k=top_k, top_p=top_p,
            repetition_penalty=rep, step_callback=step,
            # 早停：答完就停，避免模型自己接着编下一轮"你: ... 她: ..."
            stop=["\n", "你:", "你："],
        )
        print()  # 换行

        # 取出本轮「她」的回复（截断到下一个「你:」之前）
        cont = full[len(prompt):]
        reply = cont.split("\n你:")[0].strip()
        # 更新上下文，供下一轮参考
        context = prompt + reply + "\n"


if __name__ == "__main__":
    main()
