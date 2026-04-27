package com.pharma.backend.payload.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderItemRequest {
    private Long medicineId;
    private Integer quantity;
    private Double price;
}
