package com.example.demo.calculator.exception;

import com.example.demo.calculator.event.Operator;

public class InsufficientParameterException extends RuntimeException {
    private String operator;
    public String getOperator(){
        return operator;
    }

    public InsufficientParameterException(String e){
        operator = e;
    };
}
