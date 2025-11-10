# test/pages/base_page.py
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException
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
        """Click en un elemento - espera a que sea clickeable y maneja toasts"""
        # Primero esperar a que desaparezcan los toasts
        self.wait_for_toasts_to_disappear()
        
        # Luego hacer click
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()
    
    def click_with_js(self, locator):
        """Click usando JavaScript como alternativa"""
        element = self.find_element(locator)
        self.driver.execute_script("arguments[0].click();", element)
    
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
    
    def wait_for_toasts_to_disappear(self, timeout=5):
        """Esperar a que desaparezcan las notificaciones toast"""
        try:
            # Buscar toasts activos
            toasts = self.driver.find_elements(By.CLASS_NAME, "toast")
            
            if toasts:
                print(f"⏳ Esperando a que {len(toasts)} toast(s) desaparezcan...")
                # Esperar hasta que no haya toasts visibles
                WebDriverWait(self.driver, timeout).until(
                    lambda d: len(d.find_elements(By.CLASS_NAME, "toast")) == 0
                )
                print("✅ Toasts desaparecieron")
                time.sleep(0.5)  # Pequeña pausa adicional
        except TimeoutException:
            print("⚠️ Timeout esperando toasts, continuando...")
        except Exception as e:
            print(f"⚠️ Error esperando toasts: {str(e)[:50]}")
    
    def scroll_to_element(self, locator):
        """Hacer scroll hasta un elemento"""
        element = self.find_element(locator)
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.3)