# test/test_expense_tracker.py
import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoAlertPresentException


class ExpenseTrackerTests(unittest.TestCase):
    """Suite de pruebas completa para el sistema de gastos"""
    
    @classmethod
    def setUpClass(cls):
        """Configuración inicial - se ejecuta una vez"""
        cls.driver = webdriver.Chrome()
        cls.driver.maximize_window()
        cls.base_url = "http://localhost:5173"
        cls.wait = WebDriverWait(cls.driver, 20)
        
        # Credenciales de prueba
        cls.test_user = {
            "email": "cris123@gmail.com",
            "password": "147258369",
            "name": "Usuario Test",
            "income": "3000000"
        }
    
    @classmethod
    def tearDownClass(cls):
        """Limpieza final - se ejecuta una vez"""
        cls.driver.quit()
    
    def setUp(self):
        """Se ejecuta antes de cada test"""
        print(f"\n⚙️ Preparando test - URL actual: {self.driver.current_url}")
        
        # Cerrar sesión si existe
        try:
            current_url = self.driver.current_url
            
            if "login" not in current_url and "register" not in current_url:
                print("🔓 Cerrando sesión activa...")
                
                logout_btn = self.wait.until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Cerrar sesión') or contains(text(), 'cerrar sesión')]"))
                )
                logout_btn.click()
                
                time.sleep(0.5)
                try:
                    alert = self.driver.switch_to.alert
                    alert.accept()
                    print("✅ Alert confirmado")
                except NoAlertPresentException:
                    print("⚠️ No hubo alert")
                
                time.sleep(1)
        except Exception as e:
            print(f"⚠️ No se pudo cerrar sesión: {str(e)[:50]}")
        
        # Ir a la página de login
        print("🔄 Navegando a /login...")
        self.driver.get(f"{self.base_url}/login")
        time.sleep(2)
        print(f"✅ En página: {self.driver.current_url}")
    
    def tearDown(self):
        """Se ejecuta después de cada test"""
        time.sleep(1)
    
    # ==========================================
    # MÉTODOS AUXILIARES
    # ==========================================
    
    def _wait_for_toasts_to_disappear(self, timeout=6):
        """Esperar a que desaparezcan las notificaciones toast"""
        try:
            toasts = self.driver.find_elements(By.CLASS_NAME, "toast")
            
            if toasts:
                print(f"⏳ Esperando a que {len(toasts)} toast(s) desaparezcan...")
                WebDriverWait(self.driver, timeout).until(
                    lambda d: len(d.find_elements(By.CLASS_NAME, "toast")) == 0
                )
                print("✅ Toasts desaparecieron")
                time.sleep(0.5)
        except TimeoutException:
            print("⚠️ Timeout esperando toasts, continuando...")
        except Exception as e:
            print(f"⚠️ Error esperando toasts: {str(e)[:50]}")
    
    def _do_login(self):
        """Método auxiliar para hacer login rápido"""
        if "login" not in self.driver.current_url:
            self.driver.get(f"{self.base_url}/login")
            time.sleep(2)
        
        email_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        email_input.clear()
        password_input.clear()
        
        email_input.send_keys(self.test_user["email"])
        password_input.send_keys(self.test_user["password"])
        
        login_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
        login_btn.click()
        
        # Esperar a que cargue el dashboard
        time.sleep(4)
        
        # 🔹 ESPERAR A QUE DESAPAREZCAN LOS TOASTS
        self._wait_for_toasts_to_disappear()
        
        # Verificar que estamos en el dashboard
        try:
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "dashboard-grid"))
            )
            print("✅ Login completado - Dashboard cargado")
        except TimeoutException:
            print("⚠️ Timeout esperando dashboard")
            raise
    
    def _navigate_to_expenses(self):
        """Navegar a la página de gastos"""
        # Asegurar que no hay toasts
        self._wait_for_toasts_to_disappear()
        
        gastos_link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Gastos')]"))
        )
        gastos_link.click()
        time.sleep(2)
        print("✅ Navegado a página de gastos")
    
    def _add_quick_expense(self, title, amount, expense_type="expense"):
        """Agregar gasto/ingreso rápidamente"""
        title_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']"))
        )
        amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
        category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
        
        title_input.send_keys(title)
        amount_input.send_keys(amount)
        category_input.send_keys("Test")
        
        # Seleccionar tipo
        type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
        type_select.click()
        time.sleep(0.5)
        options = type_select.find_elements(By.TAG_NAME, "option")
        
        if expense_type == "income":
            for option in options:
                if "Ingreso" in option.text or "income" in option.get_attribute("value"):
                    option.click()
                    break
        else:
            for option in options:
                if "Gasto" in option.text or "expense" in option.get_attribute("value"):
                    option.click()
                    break
        
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        submit_btn.click()
        time.sleep(2)
        
        # Esperar a que desaparezca el toast después de agregar
        self._wait_for_toasts_to_disappear()
    
    # ==========================================
    # TESTS DE AUTENTICACIÓN
    # ==========================================
    
    def test_01_login_exitoso(self):
        """Test: Login con credenciales correctas"""
        print("\n🧪 Test: Login exitoso")
        
        try:
            self._do_login()
            print("✅ Login exitoso - Test completado")
        except Exception as e:
            print(f"❌ Error en login: {str(e)}")
            raise
    
    def test_02_login_credenciales_incorrectas(self):
        """Test: Login con credenciales incorrectas"""
        print("\n🧪 Test: Login con credenciales incorrectas")
        
        try:
            email_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
            )
            password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            
            email_input.clear()
            password_input.clear()
            
            email_input.send_keys("wrong@example.com")
            password_input.send_keys("wrongpassword")
            
            login_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
            login_btn.click()
            
            time.sleep(3)
            
            # Verificar que sigue en login
            self.assertIn("login", self.driver.current_url)
            print("✅ Login fallido correctamente - se mantuvo en página de login")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    def test_03_recuperar_contraseña(self):
        """Test: Proceso de recuperación de contraseña"""
        print("\n🧪 Test: Recuperación de contraseña")
        
        try:
            forgot_link = self.wait.until(
                EC.element_to_be_clickable((By.CLASS_NAME, "forgot-link"))
            )
            forgot_link.click()
            time.sleep(2)
            
            # Verificar que estamos en la página de recuperación
            self.assertIn("Recuperar contraseña", self.driver.page_source)
            
            # Ingresar email
            email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
            email_input.send_keys(self.test_user["email"])
            
            # Enviar
            submit_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
            submit_btn.click()
            
            time.sleep(3)
            print("✅ Proceso de recuperación iniciado correctamente")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    # ==========================================
    # TESTS DE DASHBOARD
    # ==========================================
    
    def test_04_visualizar_dashboard(self):
        """Test: Visualizar dashboard después de login"""
        print("\n🧪 Test: Visualizar dashboard")
        
        try:
            # Login primero
            self._do_login()
            
            # Verificar elementos del dashboard
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "dashboard-grid"))
            )
            
            # Verificar tarjetas de resumen
            cards = self.driver.find_elements(By.CLASS_NAME, "card")
            self.assertGreater(len(cards), 0, "Debe haber tarjetas de resumen")
            
            print(f"✅ Dashboard cargado - {len(cards)} tarjetas encontradas")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    def test_05_navegacion_a_gastos(self):
        """Test: Navegar a la página de gastos"""
        print("\n🧪 Test: Navegación a gastos")
        
        try:
            # Login primero
            self._do_login()
            
            # Navegar a gastos
            self._navigate_to_expenses()
            
            # Verificar que estamos en gastos
            self.assertIn("gastos", self.driver.current_url)
            
            # Verificar que existe el formulario
            form = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "expense-form"))
            )
            self.assertTrue(form.is_displayed())
            
            print("✅ Navegación a gastos exitosa")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    # ==========================================
    # TESTS DE GASTOS
    # ==========================================
    
    def test_06_agregar_gasto_simple(self):
        """Test: Agregar un gasto simple"""
        print("\n🧪 Test: Agregar gasto simple")
        
        try:
            # Login y navegar a gastos
            self._do_login()
            self._navigate_to_expenses()
            
            # Llenar formulario
            title_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']"))
            )
            amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
            category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
            
            title_input.send_keys("Test Gasto")
            amount_input.send_keys("50000")
            category_input.send_keys("Pruebas")
            
            # Seleccionar tipo "Gasto"
            type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
            type_select.click()
            time.sleep(0.5)
            options = type_select.find_elements(By.TAG_NAME, "option")
            # Buscar la opción "Gasto"
            for option in options:
                if "Gasto" in option.text or "expense" in option.get_attribute("value"):
                    option.click()
                    break
            
            # Enviar formulario
            submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
            submit_btn.click()
            
            time.sleep(3)
            self._wait_for_toasts_to_disappear()
            
            # Verificar que el gasto aparece en la tabla
            table = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "expense-table"))
            )
            self.assertIn("Test Gasto", table.text)
            
            print("✅ Gasto agregado correctamente")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    def test_07_agregar_ingreso(self):
        """Test: Agregar un ingreso"""
        print("\n🧪 Test: Agregar ingreso")
        
        try:
            self._do_login()
            self._navigate_to_expenses()
            
            # Llenar formulario
            title_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']"))
            )
            amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
            category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
            
            title_input.send_keys("Test Ingreso")
            amount_input.send_keys("100000")
            category_input.send_keys("Ingresos")
            
            # Seleccionar tipo "Ingreso"
            type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
            type_select.click()
            time.sleep(0.5)
            options = type_select.find_elements(By.TAG_NAME, "option")
            # Buscar la opción "Ingreso"
            for option in options:
                if "Ingreso" in option.text or "income" in option.get_attribute("value"):
                    option.click()
                    break
            
            # Enviar formulario
            submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
            submit_btn.click()
            
            time.sleep(3)
            self._wait_for_toasts_to_disappear()
            
            # Verificar
            table = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "expense-table"))
            )
            self.assertIn("Test Ingreso", table.text)
            
            print("✅ Ingreso agregado correctamente")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    def test_08_filtrar_gastos(self):
        """Test: Filtrar gastos usando el buscador"""
        print("\n🧪 Test: Filtrar gastos")
        
        try:
            self._do_login()
            self._navigate_to_expenses()
            
            # Agregar un gasto primero
            self._add_quick_expense("Gasto Filtrable", "25000")
            
            # Usar el filtro de búsqueda
            search_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='Buscar']"))
            )
            search_input.clear()
            search_input.send_keys("Filtrable")
            time.sleep(2)
            
            # Verificar que se muestra el gasto filtrado
            table = self.driver.find_element(By.CLASS_NAME, "expense-table")
            self.assertIn("Gasto Filtrable", table.text)
            
            print("✅ Filtro funcionando correctamente")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    def test_09_eliminar_gasto(self):
        """Test: Eliminar un gasto"""
        print("\n🧪 Test: Eliminar gasto")
        
        try:
            self._do_login()
            self._navigate_to_expenses()
            
            # Agregar un gasto para eliminar
            self._add_quick_expense("Gasto a Eliminar", "15000")
            
            # Buscar botón de eliminar
            delete_buttons = self.driver.find_elements(By.CLASS_NAME, "btn-delete")
            
            if delete_buttons:
                initial_count = len(delete_buttons)
                delete_buttons[-1].click()
                
                # Aceptar confirmación
                time.sleep(0.5)
                alert = self.driver.switch_to.alert
                alert.accept()
                
                time.sleep(2)
                
                # Verificar que se eliminó
                new_buttons = self.driver.find_elements(By.CLASS_NAME, "btn-delete")
                self.assertLess(len(new_buttons), initial_count, "El gasto debería haberse eliminado")
                
                print("✅ Gasto eliminado correctamente")
            else:
                print("⚠️ No hay gastos para eliminar")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    # ==========================================
    # TESTS DE CONFIGURACIÓN
    # ==========================================
    
    def test_10_acceder_configuracion(self):
        """Test: Acceder a la página de configuración"""
        print("\n🧪 Test: Acceder a configuración")
        
        try:
            self._do_login()
            
            # Esperar toasts
            self._wait_for_toasts_to_disappear()
            
            # Click en link de configuración
            config_link = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Configuración')]"))
            )
            config_link.click()
            time.sleep(2)
            
            # Verificar que estamos en configuración
            self.assertIn("config", self.driver.current_url)
            
            # Verificar que existe el formulario
            self.assertIn("Configuración del Usuario", self.driver.page_source)
            
            print("✅ Página de configuración cargada")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    def test_11_actualizar_ingreso(self):
        """Test: Actualizar configuración de ingreso"""
        print("\n🧪 Test: Actualizar ingreso")
        
        try:
            self._do_login()
            
            # Esperar toasts
            self._wait_for_toasts_to_disappear()
            
            # Navegar a configuración
            config_link = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Configuración')]"))
            )
            config_link.click()
            time.sleep(2)
            
            # Encontrar campo de ingreso
            income_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='number']"))
            )
            income_input.clear()
            income_input.send_keys("3500000")
            
            # Guardar cambios
            save_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Actualizar ingreso')]")
            save_btn.click()
            
            time.sleep(2)
            print("✅ Ingreso actualizado correctamente")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise


if __name__ == "__main__":
    unittest.main(verbosity=2)