package com.ensteinstore.dto.response;

public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private long expiresIn;
    private UserProfileResponse user;

    public AuthResponse() {
    }

    public AuthResponse(String token, long expiresIn, UserProfileResponse user) {
        this.token = token;
        this.type = "Bearer";
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public UserProfileResponse getUser() {
        return user;
    }

    public void setUser(UserProfileResponse user) {
        this.user = user;
    }
}
