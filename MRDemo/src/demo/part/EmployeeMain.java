package demo.part;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class EmployeeMain {
    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "Employee Data Processing");
        
        // 明确设置Jar
        job.setJarByClass(EmployeeMain.class);
        
        // 设置Mapper - 确保使用完整类名
        job.setMapperClass(demo.part.EmployeeMapper.class);
        job.setMapOutputKeyClass(IntWritable.class);
        job.setMapOutputValueClass(Employee.class);

        // 设置分区器和Reducer数量
        job.setPartitionerClass(MyPartitioner.class);
        job.setNumReduceTasks(3);

        // 设置Reducer
        job.setReducerClass(EmployeeReducer.class);
        job.setOutputKeyClass(IntWritable.class);
        job.setOutputValueClass(Employee.class);

        // 设置输入输出路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        
        // 提交作业
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}