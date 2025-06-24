package demo.part;

import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.mapreduce.Partitioner;

public class MyPartitioner extends Partitioner<IntWritable, Employee> {
    // numTask：分区的个数
    @Override
    public int getPartition(IntWritable k2, Employee v2, int numTask) {
        // 根据部门号进行分区
        
        int deptno = v2.getDeptno();
        
        // 确保分区号在0到numTask-1之间
        // 假设部门号是10、20、30等
        //return (deptno / 10 - 1) % numTask;
        if (deptno == 10){
            return 1%numTask;
        }
        else { return 0;
        } 
            
        }
        }
    
