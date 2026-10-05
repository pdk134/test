import java.util.Scanner;

public class test_j0713 {    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter a numberA:");
        int weightA = sc.nextInt();
        System.out.println("Enter a numberB:");
        int weightB = sc.nextInt();
        int biggerWeight = weightA > weightB ? weightA : weightB;
        System.out.println("The bigger number is: " + biggerWeight);
    }
}
