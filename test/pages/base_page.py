from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time


class BasePage:
    """Clase base con métodos comunes para todas las páginas"""
    
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
    
    def find_element(self, locator):
        """Encontrar un elemento con wait implícito"""
        return self.wait.until(EC.presence_of_element_located(locator))
    
    def click(self, locator):
        """Click en un elemento"""
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()
    
    def send_keys(self, locator, text):
        """Enviar texto a un campo"""
        element = self.find_element(locator)
        element.clear()
        element.send_keys(text)
    
    def get_text(self, locator):
        """Obtener texto de un elemento"""
        element = self.find_element(locator)
        return element.text
    
    def is_displayed(self, locator):
        """Verificar si elemento está visible"""
        try:
            element = self.find_element(locator)
            return element.is_displayed()
        except TimeoutException:
            return False
    
    def accept_alert(self):
        """Aceptar alert de JavaScript"""
        time.sleep(0.5)
        alert = self.driver.switch_to.alert
        alert.accept()

