import java.util.Scanner;

public class test_j0706 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter the weight of tiger a: ");
        int a = sc.nextInt();
        System.out.print("Enter the weight of tiger b: ");
        int b = sc.nextInt();
        System.out.print("Enter the weight of tiger c: ");
        int c = sc.nextInt();
        int max = a > b ? (b > c ? c : b) : (a > c ? c : a);
        System.out.println("The lighter tiger weighs: " + max + " kg");
        sc.close();
    }
}
