package com.example.demo.config;

import com.example.demo.shellcommands.DefaultShellCommand;
import org.jline.utils.AttributedString;
import org.jline.utils.AttributedStyle;
import org.jline.utils.Signals;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.core.convert.converter.GenericConverter;
import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.shell.CommandNotFound;
import org.springframework.shell.Input;
import org.springframework.shell.ResultHandler;
import org.springframework.shell.Shell;
import org.springframework.shell.jline.PromptProvider;
import org.springframework.shell.result.ResultHandlerConfig;

import javax.validation.Validation;
import javax.validation.Validator;
import java.util.Collection;

@Configuration
@Import(ResultHandlerConfig.class)
public class SpringShellConfiguration {

	@Bean
	public PromptProvider myPromptProvider() {
		return () -> new AttributedString("", AttributedStyle.DEFAULT.foreground(AttributedStyle.YELLOW));
	}
	@Bean
	@Qualifier("spring-shell")
	public ConversionService shellConversionService(ApplicationContext applicationContext) {
		Collection<Converter> converters;
		converters = applicationContext.getBeansOfType(Converter.class).values();
		Collection<GenericConverter> genericConverters = applicationContext.getBeansOfType(GenericConverter.class).values();
		Collection<ConverterFactory> converterFactories = applicationContext.getBeansOfType(ConverterFactory.class).values();

		DefaultConversionService defaultConversionService = new DefaultConversionService();
		for (Converter converter : converters) {
			defaultConversionService.addConverter(converter);
		}
		for (GenericConverter genericConverter : genericConverters) {
			defaultConversionService.addConverter(genericConverter);
		}
		for (ConverterFactory converterFactory : converterFactories) {
			defaultConversionService.addConverterFactory(converterFactory);
		}
		return defaultConversionService;
	}

	@Bean
	@ConditionalOnMissingBean(Validator.class)
	public Validator validator() {
		return Validation.buildDefaultValidatorFactory().getValidator();
	}

	@Bean
	public Shell shell(@Qualifier("main") ResultHandler resultHandler) {
		return new MyShell(resultHandler);
	}

	public static class MyShell extends Shell {
		public MyShell(ResultHandler resultHandler) {
			super(resultHandler);
		}

		private Object evaluateDefault(Input input, CommandNotFound e ){
			DefaultShellCommand bean = applicationContext.getBean(DefaultShellCommand.class);
			if(bean == null) return e;

			Thread commandThread = Thread.currentThread();
			Object sh = Signals.register("INT", () -> commandThread.interrupt());
			try {
				return bean.run(input);
			}
			finally {
				Signals.unregister("INT", sh);
			}
		}

		@Override
		public Object evaluate(Input input) {
			Object result = super.evaluate(input);
			if(result instanceof CommandNotFound){
				return evaluateDefault(input, (CommandNotFound)result);
			}
			return result;

		}

	}
}