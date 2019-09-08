package com.example.demo.calculator.event;

import com.example.demo.calculator.domain.Operations;
import lombok.Data;


public class AddEvent extends AbstractCalculateEvent {
    @Override
    public String getOperator() {
        return Operations.ADDITION;
    }
}
