import java.io.FileInputStream;
import java.io.ObjectInputStream;
import java.util.Map;

public class ReadToken {
    public static void main(String[] args) throws Exception {
        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream("tokens/StoredCredential"))) {
            Map<String, Object> map = (Map<String, Object>) ois.readObject();
            System.out.println("refresh_token: " + map.get("refresh_token"));
        }
    }
}