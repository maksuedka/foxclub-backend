import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;

import java.io.InputStreamReader;
import java.util.Collections;

public class GetRefreshToken {
    public static void main(String[] args) throws Exception {
        NetHttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
        var jsonFactory = GsonFactory.getDefaultInstance();

        // Загружаем credentials.json
        var clientSecrets = GoogleClientSecrets.load(
                jsonFactory,
                new InputStreamReader(
                        GetRefreshToken.class.getResourceAsStream("/credentials.json")
                )
        );

        // Строим flow с offline доступом
        var flow = new GoogleAuthorizationCodeFlow.Builder(
                transport, jsonFactory, clientSecrets,
                Collections.singletonList("https://www.googleapis.com/auth/gmail.send")
        ).setDataStoreFactory(new FileDataStoreFactory(new java.io.File("tokens")))
                .setAccessType("offline")
                .build();

        // Авторизация через браузер (порт 8888)
        var receiver = new LocalServerReceiver.Builder().setPort(8888).build();
        Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");

        // Выводим refresh_token
        System.out.println("refresh_token: " + credential.getRefreshToken());
        System.out.println("access_token: " + credential.getAccessToken());
    }
}