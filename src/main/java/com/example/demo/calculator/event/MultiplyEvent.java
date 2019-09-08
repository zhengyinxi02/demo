package com.example.demo.calculator.event;

import com.example.demo.calculator.domain.Operations;

public class MultiplyEvent extends AbstractCalculateEvent {
    @Override
    public String getOperator() {
        return Operations.MULTIPLICATION;
    }
}
