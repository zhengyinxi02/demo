package com.example.demo.calculator.handler;

import com.example.demo.calculator.domain.Calculator;
import com.example.demo.calculator.event.UndoEvent;
import com.example.demo.event.Handler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UndoEventHandler implements Handler<UndoEvent> {

    @Autowired
    Calculator calc;

    @Override
    public Class<UndoEvent> getEventClass() {
        return UndoEvent.class;
    }

    @Override
    public void onEvent(UndoEvent event) {
        calc.undo();
    }
}