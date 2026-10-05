public class test_j0712 {
    public static void main(String[] args) {
        int weight1 = 100;
        int weight2 = 120;
        int weight3 = 115;
        int middleWeight = weight1 > weight2 ? weight1 : weight2;
        int finalWeight = weight3 > middleWeight ? weight3 : middleWeight;
        System.out.println("The Biggest Weight is " + finalWeight);
    }
}