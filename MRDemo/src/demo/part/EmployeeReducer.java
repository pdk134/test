package demo.part;

import java.io.IOException;

import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.mapreduce.Reducer;

public class EmployeeReducer extends Reducer<IntWritable, Employee, IntWritable, Employee> {
    @Override
    protected void reduce(IntWritable k3, Iterable<Employee> v3, Context context)
                    throws IOException, InterruptedException{
                     //把同一分区中的员工数据进行输出
                      for(Employee v2:v3)  {
                        context.write(k3,v2);
                      }
                    }
}
