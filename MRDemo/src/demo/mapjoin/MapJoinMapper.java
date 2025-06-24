package demo.mapjoin;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
//                                                             ��������  Ա������
public class MapJoinMapper extends Mapper<LongWritable, Text, Text, Text> { 

    private Map<Integer, String> dept = new HashMap<Integer, String>();

    @Override
    protected void map(LongWritable key1, Text value1, Context context)
           throws IOException, InterruptedException {
           // ��ȡԱ������
           String data = value1.toString();
           String[] words = data.split(",");

           //ȡ����Ա���Ĳ��ź�
           int deptno = Integer.parseInt(words[2]);

           //ִ��Join����
           context.write(new Text(dept.get(deptno)),  //���ź�
                         new Text(words[1]));          //Ա������
           }

    @Override
    protected void setup(Mapper<LongWritable, Text, Text, Text>.Context context)
           throws IOException, InterruptedException {
        //��Map������г�ʼ�������������ݽ��л���
        // /scott/dept.csv   
        String path = context.getCacheFiles()[0].getPath();

        int index = path.lastIndexOf("/");
        String fileName = path.substring(index+1);

        FileInputStream fileInput = new FileInputStream(fileName);
        InputStreamReader readFile = new InputStreamReader(fileInput);
        BufferedReader reader = new BufferedReader(readFile);

        String line = null;
        while((line=reader.readLine()) != null){
              String[] fields =line.split(",");

              //���벿������
              dept.put(Integer.parseInt(fields[0]), fields[1]);

        }

        }    
}