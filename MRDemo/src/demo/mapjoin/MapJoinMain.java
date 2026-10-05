package demo.mapjoin;

import java.net.URI;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class MapJoinMain {
    
    public static void main(String[] args) throws Exception{
        Job job = Job.getInstance(new Configuration());
        job.setJarByClass(MapJoinMain.class);

        job.setMapperClass(MapJoinMapper.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);   

        job.addCacheFile(new URI(args[0]));
        
        FileInputFormat.setInputPaths(job, new Path(args[1]));
        FileOutputFormat.setOutputPath(job, new Path(args[2]));
        

        job.waitForCompletion(true);
    }
}
