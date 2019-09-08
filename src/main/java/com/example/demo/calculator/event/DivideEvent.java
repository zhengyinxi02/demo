package com.example.demo.calculator.event;

import com.example.demo.calculator.domain.Operations;

public class DivideEvent extends AbstractCalculateEvent {
    @Override
    public String getOperator() {
        return Operations.DIVISION;
    }
}
