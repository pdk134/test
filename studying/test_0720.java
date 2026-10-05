import java.util.Scanner;

public class test_0720 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("œÎ≥‘…∂");
        String noodles = sc.next();
        switch (noodles) {
            case "A":
                System.out.println("1");
                break;
            case "B":
                System.out.println("2");
                break;
            case "C":
                System.out.println("3");
                break;
            default:
                System.out.println("4");
                break;           
        }
    }
}