from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class RegisterPage(BasePage):
    """Página de Registro"""
    
    # Locators
    NAME_INPUT = (By.CSS_SELECTOR, "input[placeholder='Tu nombre completo']")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    INCOME_INPUT = (By.CSS_SELECTOR, "input[type='number']")
    INCOME_TYPE_SELECT = (By.CSS_SELECTOR, "select")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    LOGIN_LINK = (By.CLASS_NAME, "redirect-login")
    
    def __init__(self, driver):
        super().__init__(driver)
        self.url = "http://localhost:5173/register"
    
    def navigate(self):
        """Navegar a la página de registro"""
        self.driver.get(self.url)
    
    def enter_name(self, name):
        """Ingresar nombre"""
        self.send_keys(self.NAME_INPUT, name)
    
    def enter_email(self, email):
        """Ingresar email"""
        self.send_keys(self.EMAIL_INPUT, email)
    
    def enter_password(self, password):
        """Ingresar contraseña"""
        self.send_keys(self.PASSWORD_INPUT, password)
    
    def enter_income(self, income):
        """Ingresar ingreso"""
        self.send_keys(self.INCOME_INPUT, income)
    
    def select_income_type(self, income_type="monthly"):
        """Seleccionar tipo de ingreso"""
        select = self.find_element(self.INCOME_TYPE_SELECT)
        select.click()
        
        options = select.find_elements(By.TAG_NAME, "option")
        if income_type == "monthly":
            options[0].click()
        else:
            options[1].click()
    
    def click_submit(self):
        """Click en botón de registrar"""
        self.click(self.SUBMIT_BUTTON)
    
    def register(self, name, email, password, income, income_type="monthly"):
        """Realizar registro completo"""
        self.enter_name(name)
        self.enter_email(email)
        self.enter_password(password)
        self.select_income_type(income_type)
        self.enter_income(income)
        self.click_submit()
