import java.util.Scanner;

public class test_j0711 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("ÇëÊäÈëÆ±ºÅ£º");
        int number = sc.nextInt();
        if (number >= 0 && number <= 100) {        
            if (number % 2 == 0) {
                System.out.println("Çë×öÓÒ±ß");
            } else {
                System.out.println("Çë×ö×ó±ß");
            }
        } else {
            System.out.println("ÎŞĞ§Æ±ºÅ");
        }
    }
}
