import java.io.FileInputStream;
import java.io.ObjectInputStream;
import java.util.Map;

public class DebugStoredCredential {
    public static void main(String[] args) throws Exception {
        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream("tokens/StoredCredential"))) {
            Map<String, Object> map = (Map<String, Object>) ois.readObject();
            System.out.println("=== Все ключи в StoredCredential ===");
            for (String key : map.keySet()) {
                System.out.println("Ключ: " + key + " -> значение: " + map.get(key));
            }
        }
    }
}