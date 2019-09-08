package com.example.demo.calculator.event;

import com.example.demo.calculator.domain.Operations;
import com.example.demo.event.AbstractEvent;

public class ClearEvent extends AbstractEvent implements Operator {

    @Override
    public String getOperator() {
        return Operations.CLEAR;
    }
}
