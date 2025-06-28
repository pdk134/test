import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.sql.DriverManager;
import java.sql.SQLException;


/*
 * 数据库连接池管理类（单例模式实现）
 * 使用线程安全的懒汉式实现
 */
public class DatabaseConnectionPool {
    //单例实现
    private static DatabaseConnectionPool instance;

    //数据库连接配置
    private final String url;
    private final String username;
    private final String password;

    //空闲连接列表
    private final List<Connection> freeConnections = new ArrayList<>();
    //使用中的连接列表
    private final List<Connection> usedConnections = new ArrayList<>(); 

    //最大连接数
    private static final int MAX_CONNECTIONS = 10;

    //私有构造函数
    private DatabaseConnectionPool() {
        //这里应该从配置文件中读取，为了实列直接硬编码
        this.url = "jdbc:mysql://localhost:3306/mydb";
        this.username = "root";
        this.password = "password";

        //初始化连接池
        initializePool();
    }

    //获取单例实现（线程安全）
    public static synchronized DatabaseConnectionPool getInstance() {
        if (instance == null) {
            instance = new DatabaseConnectionPool();
        }
        return instance;
    }

    //初始化连接池
    private void initializePool() {
        try {
            //加载数据库驱动
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            //创建初始连接
            for (int i = 0; i < MAX_CONNECTIONS; i++) {
                freeConnections.add(createNewConnection());
            }
            System.out.println("连接池初始化完成，空闲连接数：" + freeConnections.size());
            } catch (ClassNotFoundException e) {
                System.err.println("数据库驱动加载失败：" + e.getMessage());
            }
        }

    //创建新的数据库连接
    private Connection createNewConnection() throws SQLException {
        return DriverManager.getConnection(url, username, password);
    }

    //