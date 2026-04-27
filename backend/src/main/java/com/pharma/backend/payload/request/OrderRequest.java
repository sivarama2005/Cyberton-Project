package com.pharma.backend.payload.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OrderRequest {
    private List<OrderItemRequest> items;
    private Double totalAmount;
    private String address;
    private String contactNumber;
    private String couponCode;
    private Integer pointsUsed;
}
