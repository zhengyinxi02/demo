package com.example.demo.calculator;

import com.example.demo.calculator.event.Operator;
import com.example.demo.calculator.exception.IllegalOperatorException;
import com.example.demo.calculator.exception.InsufficientParameterException;
import com.example.demo.event.Event;
import com.example.demo.event.EventDispatcher;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.shell.Input;
import org.springframework.stereotype.Component;

import java.util.EmptyStackException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ShellCalculatorShellCommandImpl extends AbstractShellCalculatorCommand {

    @Autowired
    EventDispatcher handler;

    @Autowired
    CalculateEventFactory factory;

    @Override
    public Object run(Input input) {
        //use counter for position index
        String rawText = input.rawText();
        List<String> words = input.words().stream().filter(w -> !StringUtils.isEmpty(w)).collect(Collectors.toList());
        int index = 0;
        for (String word : words) {
            //to record current index of word at rawtext
            index = StringUtils.indexOf(rawText, word, index);
            Event event = null;
            try {
                event = factory.create(word);
            } catch (UnsupportedOperationException e) {
                return "operator " + word + " (position: " + (index + 1) + "): " + "invalid command\n" + stackToString();
            }
            try {
                handler.dispatch(event);
            } catch (EmptyStackException e) {
                if (event instanceof Operator) {
                    Operator o = (Operator) event;
                    return "operator " + o.getOperator() + " (position: " + (index + 1) + "): " + "insufficient parameters\n" + stackToString();
                }
            } catch (InsufficientParameterException e) {
                return "operator " + e.getOperator() + " (position: " + (index + 1) + "): " + "insufficient parameters\n" + stackToString();
            } catch (IllegalOperatorException e) {
                return "operator " + e.getOperator() + " (position: " + (index + 1) + "): " + "illegal parameters\n" + stackToString();
            }
        }
        return stackToString();
    }
}
