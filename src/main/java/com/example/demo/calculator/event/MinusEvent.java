package com.example.demo.calculator.event;

import com.example.demo.calculator.domain.Operations;

public class MinusEvent extends AbstractCalculateEvent {
    @Override
    public String getOperator() {
        //BigDecimal.valueOf(1).di()
        return Operations.SUBTRACTION;
    }
}
