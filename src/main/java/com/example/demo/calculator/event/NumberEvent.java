package com.example.demo.calculator.event;

import com.example.demo.calculator.domain.Operations;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

@RequiredArgsConstructor
@Getter
public class NumberEvent  extends AbstractCalculateEvent {
    private final BigDecimal arg;
    @Override
    public String getOperator() {
        return Operations.NUMBER;
    }
}
