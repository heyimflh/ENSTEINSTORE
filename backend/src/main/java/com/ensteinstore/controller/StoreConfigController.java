package com.ensteinstore.controller;

import com.ensteinstore.config.AppProperties;
import com.ensteinstore.dto.response.StoreConfigResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store")
@Tag(name = "Store Configuration", description = "Endpoint konfigurasi publik toko, rekening pembayaran, biaya pengiriman, dan batas upload")
public class StoreConfigController {

    private final AppProperties appProperties;

    public StoreConfigController(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @GetMapping("/config")
    @Operation(summary = "Mendapatkan konfigurasi toko publik", description = "Mengembalikan biaya kirim, batas waktu pembayaran, rekening bank dan opsi e-wallet")
    public ResponseEntity<StoreConfigResponse> getStoreConfig() {
        StoreConfigResponse response = new StoreConfigResponse();
        AppProperties.Store store = appProperties.getStore();
        response.setStoreName(store.getName());
        response.setOwner(store.getOwner());
        response.setTagline(store.getTagline());
        response.setSubtagline(store.getSubtagline());
        response.setPhone(store.getPhone());
        response.setWhatsapp(store.getWhatsapp());
        response.setEmail(store.getEmail());
        response.setAddress(store.getAddress());
        response.setHours(store.getHours());

        response.setDeliveryFee(appProperties.getDelivery().getFee());
        response.setPaymentExpiryHours(appProperties.getPayment().getExpiryHours());
        response.setSimulationEnabled(appProperties.getPayment().isSimulationEnabled());
        response.setMaxUploadBytes(appProperties.getUpload().getMaxBytes());

        List<Map<String, String>> bankAccounts = appProperties.getPayment().getBankAccounts();
        if (bankAccounts == null || bankAccounts.isEmpty()) {
            response.setBankAccounts(List.of(
                    Map.of(
                            "bankName", "BCA (Bank Central Asia)",
                            "bankCode", "BCA",
                            "accountNumber", "883019283391",
                            "accountHolder", "TOKO ENSTEIN KEBUMEN"
                    ),
                    Map.of(
                            "bankName", "Bank Mandiri",
                            "bankCode", "MANDIRI",
                            "accountNumber", "1370029381029",
                            "accountHolder", "TOKO ENSTEIN KEBUMEN"
                    ),
                    Map.of(
                            "bankName", "BRI (Bank Rakyat Indonesia)",
                            "bankCode", "BRI",
                            "accountNumber", "012301002938501",
                            "accountHolder", "TOKO ENSTEIN KEBUMEN"
                    )
            ));
        } else {
            response.setBankAccounts(bankAccounts);
        }

        List<Map<String, String>> ewallets = appProperties.getPayment().getEwallets();
        if (ewallets == null || ewallets.isEmpty()) {
            response.setEwallets(List.of(
                    Map.of(
                            "provider", "QRIS & E-Wallet Nasional",
                            "accountNumber", "0812-3456-7890",
                            "accountHolder", "TOKO ENSTEIN STORE",
                            "nmid", "ID1020039281920"
                    )
            ));
        } else {
            response.setEwallets(ewallets);
        }

        return ResponseEntity.ok(response);
    }
}
