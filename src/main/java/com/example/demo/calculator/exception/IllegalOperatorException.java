package com.example.demo.calculator.exception;

public class IllegalOperatorException extends RuntimeException {
    private String operator;

    public String getOperator() {
        return operator;
    }

    public IllegalOperatorException(String e) {
        operator = e;
    }

    ;
}
