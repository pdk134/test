import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.sql.DriverManager;
import java.sql.SQLException;


/*
 * ���ݿ����ӳع����ࣨ����ģʽʵ�֣�
 * ʹ���̰߳�ȫ������ʽʵ��
 */
public class DatabaseConnectionPool {
    //����ʵ��
    private static DatabaseConnectionPool instance;

    //���ݿ���������
    private final String url;
    private final String username;
    private final String password;

    //���������б�
    private final List<Connection> freeConnections = new ArrayList<>();
    //ʹ���е������б�
    private final List<Connection> usedConnections = new ArrayList<>(); 

    //���������
    private static final int MAX_CONNECTIONS = 10;

    //˽�й��캯��
    private DatabaseConnectionPool() {
        //����Ӧ�ô������ļ��ж�ȡ��Ϊ��ʵ��ֱ��Ӳ����
        this.url = "jdbc:mysql://localhost:3306/mydb";
        this.username = "root";
        this.password = "password";

        //��ʼ�����ӳ�
        initializePool();
    }

    //��ȡ����ʵ�֣��̰߳�ȫ��
    public static synchronized DatabaseConnectionPool getInstance() {
        if (instance == null) {
            instance = new DatabaseConnectionPool();
        }
        return instance;
    }

    //��ʼ�����ӳ�
    private void initializePool() {
        try {
            //�������ݿ�����
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            //������ʼ����
            for (int i = 0; i < MAX_CONNECTIONS; i++) {
                freeConnections.add(createNewConnection());
            }
            System.out.println("���ӳس�ʼ����ɣ�������������" + freeConnections.size());
            } catch (ClassNotFoundException e) {
                System.err.println("���ݿ���������ʧ�ܣ�" + e.getMessage());
            }
        }

    //�����µ����ݿ�����
    private Connection createNewConnection() throws SQLException {
        return DriverManager.getConnection(url, username, password);
    }

    //