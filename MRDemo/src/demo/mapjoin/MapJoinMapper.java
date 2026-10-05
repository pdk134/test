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
//                                                             部门名称  员工姓名
public class MapJoinMapper extends Mapper<LongWritable, Text, Text, Text> { 

    private Map<Integer, String> dept = new HashMap<Integer, String>();

    @Override
    protected void map(LongWritable key1, Text value1, Context context)
           throws IOException, InterruptedException {
           // 读取员工数据
           String data = value1.toString();
           String[] words = data.split(",");

           //取出该员工的部门号
           int deptno = Integer.parseInt(words[2]);

           //执行Join连接
           context.write(new Text(dept.get(deptno)),  //部门号
                         new Text(words[1]));          //员工性名
           }

    @Override
    protected void setup(Mapper<LongWritable, Text, Text, Text>.Context context)
           throws IOException, InterruptedException {
        //对Map任务进行初始化，将部门数据进行缓存
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

              //放入部门数据
              dept.put(Integer.parseInt(fields[0]), fields[1]);

        }

        }    
}