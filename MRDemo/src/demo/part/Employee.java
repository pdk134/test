package demo.part;

import org.apache.hadoop.io.Writable;
import java.io.DataInput;
import java.io.DataOutput;
import java.io.IOException;

public class Employee implements Writable {
    private int empno;      // 员工号
    private String ename;   // 员工姓名
    private int deptno;     // 部门号
    private double salary;  // 工资

    // 无参构造函数
    public Employee() {}

    // 带参构造函数
    public Employee(int empno, String ename, int deptno, double salary) {
        this.empno = empno;
        this.ename = ename;
        this.deptno = deptno;
        this.salary = salary;
    }

    // 序列化方法
    @Override
    public void write(DataOutput out) throws IOException {
        out.writeInt(empno);
        out.writeUTF(ename);
        out.writeInt(deptno);
        out.writeDouble(salary);
    }

    // 反序列化方法
    @Override
    public void readFields(DataInput in) throws IOException {
        empno = in.readInt();
        ename = in.readUTF();
        deptno = in.readInt();
        salary = in.readDouble();
    }

    // Getter和Setter方法
    public int getEmpno() {
        return empno;
    }

    public void setEmpno(int empno) {
        this.empno = empno;
    }

    public String getEname() {
        return ename;
    }

    public void setEname(String ename) {
        this.ename = ename;
    }

    public int getDeptno() {
        return deptno;
    }

    public void setDeptno(int deptno) {
        this.deptno = deptno;
    }

    public double getSalary() {
        return salary;
    }

    public void setSalary(double salary) {
        this.salary = salary;
    }

    @Override
    public String toString() {
        return empno + "\t" + ename + "\t" + deptno + "\t" + salary;
    }
}