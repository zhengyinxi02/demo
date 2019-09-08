package com.example.demo.event;

public interface Handler<E extends Event> {

    void onEvent(E event);

}
