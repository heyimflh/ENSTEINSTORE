package com.ensteinstore.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Store store = new Store();
    private Delivery delivery = new Delivery();
    private Payment payment = new Payment();
    private Upload upload = new Upload();
    private Cors cors = new Cors();
    private Jwt jwt = new Jwt();

    public Store getStore() {
        return store;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public Delivery getDelivery() {
        return delivery;
    }

    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public Upload getUpload() {
        return upload;
    }

    public void setUpload(Upload upload) {
        this.upload = upload;
    }

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }

    public Jwt getJwt() {
        return jwt;
    }

    public void setJwt(Jwt jwt) {
        this.jwt = jwt;
    }

    public static class Store {
        private String name = "ENSTEINSTORE";
        private String owner = "Toko Enstein";
        private String tagline = "Your Trusted Store for Rainwear Materials and Accessories";
        private String subtagline = "Penjualan bahan jas hujan dan komponen pendukung konveksi jas hujan";
        private String phone = "+62 838 7694 2484";
        private String whatsapp = "+62 838 7694 2484";
        private String email = "sales@ensteinstore.com";
        private String address = "Jl. Kertanegara Km. 03, Tanahsari, Kebumen, Jawa Tengah";
        private String hours = "Senin - Sabtu: 08.00 - 17.00 WIB (Minggu Libur)";

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getOwner() { return owner; }
        public void setOwner(String owner) { this.owner = owner; }
        public String getTagline() { return tagline; }
        public void setTagline(String tagline) { this.tagline = tagline; }
        public String getSubtagline() { return subtagline; }
        public void setSubtagline(String subtagline) { this.subtagline = subtagline; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getWhatsapp() { return whatsapp; }
        public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getHours() { return hours; }
        public void setHours(String hours) { this.hours = hours; }
    }

    public static class Delivery {
        private BigDecimal fee = new BigDecimal("15000");

        public BigDecimal getFee() { return fee; }
        public void setFee(BigDecimal fee) { this.fee = fee; }
    }

    public static class Payment {
        private int expiryHours = 24;
        private boolean simulationEnabled = true;
        private List<Map<String, String>> bankAccounts = new ArrayList<>();
        private List<Map<String, String>> ewallets = new ArrayList<>();

        public int getExpiryHours() { return expiryHours; }
        public void setExpiryHours(int expiryHours) { this.expiryHours = expiryHours; }
        public boolean isSimulationEnabled() { return simulationEnabled; }
        public void setSimulationEnabled(boolean simulationEnabled) { this.simulationEnabled = simulationEnabled; }
        public List<Map<String, String>> getBankAccounts() { return bankAccounts; }
        public void setBankAccounts(List<Map<String, String>> bankAccounts) { this.bankAccounts = bankAccounts; }
        public List<Map<String, String>> getEwallets() { return ewallets; }
        public void setEwallets(List<Map<String, String>> ewallets) { this.ewallets = ewallets; }
    }

    public static class Upload {
        private long maxBytes = 2097152;
        private String dir = "./uploads";
        private List<String> allowedExtensions = List.of("jpg", "jpeg", "png", "webp");

        public long getMaxBytes() { return maxBytes; }
        public void setMaxBytes(long maxBytes) { this.maxBytes = maxBytes; }
        public String getDir() { return dir; }
        public void setDir(String dir) { this.dir = dir; }
        public List<String> getAllowedExtensions() { return allowedExtensions; }
        public void setAllowedExtensions(List<String> allowedExtensions) { this.allowedExtensions = allowedExtensions; }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:3000";

        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Jwt {
        private String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        private long expirationMs = 28800000;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    }
}
