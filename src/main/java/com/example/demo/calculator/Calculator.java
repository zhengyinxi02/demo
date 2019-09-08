package com.example.demo.calculator;

import com.example.demo.calculator.exception.IllegalOperatorException;
import com.example.demo.calculator.exception.InsufficientParameterException;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
public class Calculator {
    private static Integer PRECISION = 15;
    private static Integer SCALE_FOR_DISPLAY = 15;
    //stack to show to user
    private Stack<BigDecimal> values;

    //save all user input value
    private Stack<BigDecimal> valueHistory;

    //save all user input operation
    private Stack<String> operationHistory;

    private MathContext mathContext;

    public Calculator() {
        values = new Stack<>();
        valueHistory = new Stack<>();
        operationHistory = new Stack<>();
        mathContext = new MathContext(PRECISION);
    }

    public List<BigDecimal> getValues() {
        return new ArrayList<>(values)
        .stream().map(v->{
                    BigDecimal result = v.plus();
                    if(result.scale()> SCALE_FOR_DISPLAY){
                        result.setScale(SCALE_FOR_DISPLAY, BigDecimal.ROUND_HALF_UP);
                    }

                    return result;
                }).collect(Collectors.toList());
    }

    // + - * /
    public void doBiOperation(String operation, BiFunction<BigDecimal, BigDecimal, BigDecimal> function, BiFunction<BigDecimal, BigDecimal, Boolean> validator) {
        //check for size, if size is less than 2 throw exception directly
        if (values.size() < 2) {
            throw new InsufficientParameterException(operation);
        }
        BigDecimal first = values.pop();
        BigDecimal second = values.pop();
        if(validator !=null && !validator.apply(first, second)){
            values.push(second);
            values.push(first);
            throw new IllegalOperatorException(operation);
        }
        values.push(function.apply(first, second));
        valueHistory.push(first);
        valueHistory.push(second);
        operationHistory.push(operation);
    }

    // sqrt
    // and more...
    public void doOperation(String operation, Function<BigDecimal, BigDecimal> function, Function<BigDecimal, Boolean> validator) {
        if (values.size() < 1) {
            throw new InsufficientParameterException(operation);
        }

        BigDecimal first = values.pop();
        if(validator !=null && !validator.apply(first)){
            values.push(first);
            throw new IllegalOperatorException(operation);
        }
        values.push(function.apply(first));
        valueHistory.push(first);
        operationHistory.push(operation);
    }

    public void doClear() {
        operationHistory.clear();
        while (!values.empty()) {
            valueHistory.push(values.pop());
        }
        operationHistory.push(Operations.CLEAR);
    }

    public void doNumeric(BigDecimal input) {
        values.push(input);
        valueHistory.push(input);
        operationHistory.push(Operations.NUMBER);
    }

    public void undo() {
        if (operationHistory.empty() || valueHistory.empty()) {
            return;
        }
        String str = operationHistory.pop();
        if (values.empty() && !Operations.CLEAR.equals(str)) {
            return;
        }
        if (Operations.biFunction(str)) {
            undoBiOperation();
        } else if (Operations.function(str)) {
            undoOperation();
        } else if (Operations.clear(str)) {
            undoClear();
        } else if (Operations.number(str)) {
            undoNumeric();
        }
    }

    private void undoBiOperation() {
        values.pop();
        values.push(valueHistory.pop());
        values.push(valueHistory.pop());
        operationHistory.pop();
    }

    private void undoOperation() {
        values.pop();
        values.push(valueHistory.pop());
        operationHistory.pop();
    }

    private void undoNumeric() {
        values.pop();
        valueHistory.pop();
    }

    private void undoClear() {
        values.clear();

        while (!valueHistory.empty()) {
            values.push(valueHistory.pop());
        }
        operationHistory.pop();
    }

}
