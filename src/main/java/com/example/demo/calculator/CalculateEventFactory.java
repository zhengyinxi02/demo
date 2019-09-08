package com.example.demo.calculator;

import com.example.demo.calculator.domain.Operations;
import com.example.demo.calculator.event.AddEvent;
import com.example.demo.calculator.event.ClearEvent;
import com.example.demo.calculator.event.DivideEvent;
import com.example.demo.calculator.event.MinusEvent;
import com.example.demo.calculator.event.MultiplyEvent;
import com.example.demo.calculator.event.NumberEvent;
import com.example.demo.calculator.event.SqrtEvent;
import com.example.demo.calculator.event.UndoEvent;
import com.example.demo.event.Event;
import org.springframework.stereotype.Component;
import org.springframework.util.NumberUtils;

import java.math.BigDecimal;

@Component
public class CalculateEventFactory {

    Event createNumberEvent(String word) {
        BigDecimal bigDecimal = null;
        try {
            bigDecimal = NumberUtils.parseNumber(word, BigDecimal.class);
            return new NumberEvent(bigDecimal);
        } catch (IllegalArgumentException e) {
            throw new UnsupportedOperationException(word);
        }
    }

    public Event create(String word) {
        switch (word) {
            case Operations.ADDITION:
                return new AddEvent();
            case Operations.SUBTRACTION:
                return new MinusEvent();
            case Operations.MULTIPLICATION:
                return new MultiplyEvent();
            case Operations.DIVISION:
                return new DivideEvent();
            case Operations.SQRT:
                return new SqrtEvent();
            case Operations.UNDO:
                return new UndoEvent();
            case Operations.CLEAR:
                return new ClearEvent();

            default:
                return createNumberEvent(word);
        }
    }
}
