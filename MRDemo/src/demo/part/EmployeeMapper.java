package demo.part;

import java.io.IOException;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class EmployeeMapper extends Mapper<LongWritable, Text, IntWritable, Employee> {
    private IntWritable k2 = new IntWritable();
    private Employee v2 = new Employee();

    @Override
    protected void map(LongWritable key, Text value, Context context) 
            throws IOException, InterruptedException {
        // 输入数据格式示例: 7369,SMITH,20,800.0
        String[] fields = value.toString().split(",");
        if (fields.length == 4) {
            try {
                int empno = Integer.parseInt(fields[0]);
                String ename = fields[1];
                int deptno = Integer.parseInt(fields[2]);
                double salary = Double.parseDouble(fields[3]);
                
                v2.setEmpno(empno);
                v2.setEname(ename);
                v2.setDeptno(deptno);
                v2.setSalary(salary);
                
                k2.set(deptno);  // 使用部门号作为key
                
                context.write(k2, v2);
            } catch (NumberFormatException e) {
                // 忽略格式不正确的数据
            }
        }
    }
}