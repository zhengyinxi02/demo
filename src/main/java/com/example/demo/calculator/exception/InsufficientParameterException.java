package com.example.demo.calculator.exception;

public class InsufficientParameterException extends RuntimeException {
    private String operator;

    public String getOperator() {
        return operator;
    }

    public InsufficientParameterException(String e) {
        operator = e;
    }

    ;
}
