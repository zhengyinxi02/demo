package com.example.demo.calculator.event;

import com.example.demo.calculator.Operations;

public class SqrtEvent extends AbstractCalculateEvent {
    @Override
    public String getOperator() {
        return Operations.SQRT;
    }
}
