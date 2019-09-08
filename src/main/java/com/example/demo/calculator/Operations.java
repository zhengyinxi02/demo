package com.example.demo.calculator;

public class Operations {
    public static final String ADDITION = "+";
    public static final String SUBTRACTION = "-";
    public static final String MULTIPLICATION = "*";
    public static final String DIVISION = "/";
    public static final String CLEAR = "clear";
    public static final String UNDO = "undo";
    public static final String SQRT = "sqrt";

    //for number event
    public static final String NUMBER = "number";

    public static Boolean biFunction(String o) {
        return ADDITION.equals(o) || SUBTRACTION.equals(o) || MULTIPLICATION.equals(o) || DIVISION.equals(o);
    }

    public static Boolean function(String o) {
        return SQRT.equals(o);
    }

    public static Boolean number(String o) {
        return NUMBER.equals(o);
    }

    public static Boolean clear(String o) {
        return CLEAR.equals(o);
    }

    public static Boolean undo(String o) {
        return UNDO.equals(o);
    }
}
