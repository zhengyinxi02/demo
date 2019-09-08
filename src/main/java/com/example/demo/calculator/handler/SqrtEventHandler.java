package com.example.demo.calculator.handler;

import com.example.demo.calculator.Calculator;
import com.example.demo.calculator.event.SqrtEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.NumberUtils;

import java.math.BigDecimal;

@Component
public class SqrtEventHandler implements Handler<SqrtEvent> {

    @Autowired
    Calculator calc;
    @Override
    public Class<SqrtEvent> getEventClass() {
        return SqrtEvent.class;
    }

    @Override
    public void onEvent(SqrtEvent event) {
        calc.doOperation(event.getOperator(), i->{
            //fixme precision?
            double sqrt = Math.sqrt(i.doubleValue());
            return new BigDecimal(sqrt);
        },i->i.compareTo(BigDecimal.ZERO)>0);
    }
}
