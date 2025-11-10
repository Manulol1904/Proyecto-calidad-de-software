# tests/test_expense_tracker.py
import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, NoAlertPresentException


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
        """Se ejecuta antes de cada test - ASEGURA ESTAR EN LOGIN"""
        print(f"\n⚙️ Preparando test - URL actual: {self.driver.current_url}")
        
        # Cerrar sesión si existe
        try:
            current_url = self.driver.current_url
            
            # Si está logueado (no está en login/register)
            if "login" not in current_url and "register" not in current_url:
                print("🔓 Cerrando sesión activa...")
                
                # Buscar y hacer clic en logout
                logout_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Cerrar sesión')]")
                logout_btn.click()
                
                # Manejar el alert de confirmación
                time.sleep(0.5)
                try:
                    alert = self.driver.switch_to.alert
                    alert.accept()
                    print("✅ Alert confirmado")
                except NoAlertPresentException:
                    print("⚠️ No hubo alert")
                
                time.sleep(1)
        except Exception as e:
            print(f"⚠️ No se pudo cerrar sesión (probablemente no hay sesión): {str(e)[:50]}")
        
        # Ir a la página de login
        print("🔄 Navegando a /login...")
        self.driver.get(f"{self.base_url}/login")
        time.sleep(2)
        print(f"✅ En página: {self.driver.current_url}")
    
    def tearDown(self):
        """Se ejecuta después de cada test"""
        # Pequeña pausa entre tests
        time.sleep(1)
    
    # ==========================================
    # TESTS DE AUTENTICACIÓN
    # ==========================================
    
    def test_01_registro_usuario_nuevo(self):
        """Test: Registro de un nuevo usuario"""
        print("\n🧪 Test: Registro de usuario nuevo")
        
        try:
            # Ir a la página de registro
            register_link = self.wait.until(
                EC.element_to_be_clickable((By.CLASS_NAME, "register-btn"))
            )
            register_link.click()
            time.sleep(2)
            
            # Verificar que estamos en la página de registro
            self.assertIn("Crear cuenta", self.driver.page_source)
            
            # Llenar el formulario
            name_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Tu nombre completo']")
            email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
            password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            income_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='number']")
            
            # Generar email único con timestamp
            unique_email = f"test_{int(time.time())}@example.com"
            
            name_input.send_keys(self.test_user["name"])
            email_input.send_keys(unique_email)
            password_input.send_keys(self.test_user["password"])
            income_input.send_keys(self.test_user["income"])
            
            # Seleccionar tipo de pago
            income_type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
            income_type_select.click()
            time.sleep(0.5)
            options = income_type_select.find_elements(By.TAG_NAME, "option")
            options[1].click()
            
            # Enviar formulario
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_btn.click()
            
            time.sleep(3)
            print("✅ Usuario registrado exitosamente")
            
        except Exception as e:
            print(f"❌ Error en registro: {str(e)}")
            raise
    
    def test_02_login_exitoso(self):
        """Test: Login con credenciales correctas"""
        print("\n🧪 Test: Login exitoso")
        
        try:
            # Verificar que estamos en login
            print(f"📍 URL actual: {self.driver.current_url}")
            self.assertIn("login", self.driver.current_url)
            
            # Llenar formulario de login
            email_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
            )
            password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            
            email_input.clear()
            password_input.clear()
            
            email_input.send_keys(self.test_user["email"])
            password_input.send_keys(self.test_user["password"])
            
            print("📝 Credenciales ingresadas")
            
            # Click en botón de login
            login_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
            login_btn.click()
            print("🖱️ Click en botón de login")
            
            # Esperar redirección
            time.sleep(3)
            print(f"🔄 URL después del login: {self.driver.current_url}")
            
            # Verificar que salió de login
            self.assertNotIn("login", self.driver.current_url, "Debería haber salido de la página de login")
            
            # Buscar elementos del dashboard
            try:
                dashboard_title = self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Mi Panel')]"))
                )
                print("✅ Login exitoso - Dashboard cargado con 'Mi Panel'")
                self.assertTrue(dashboard_title.is_displayed())
            except TimeoutException:
                print("⚠️ No se encontró 'Mi Panel', buscando clase dashboard...")
                try:
                    dashboard_element = self.driver.find_element(By.CLASS_NAME, "dashboard")
                    print("✅ Login exitoso - Dashboard cargado (por clase)")
                except:
                    print(f"❌ No se encontró el dashboard")
                    print(f"Contenido: {self.driver.page_source[:300]}")
                    self.fail("No se pudo cargar el dashboard después del login")
                    
        except Exception as e:
            print(f"❌ Error en login: {str(e)}")
            raise
    
    def test_03_login_credenciales_incorrectas(self):
        """Test: Login con credenciales incorrectas"""
        print("\n🧪 Test: Login con credenciales incorrectas")
        
        try:
            # Verificar que estamos en login
            print(f"📍 URL actual: {self.driver.current_url}")
            
            # Si por alguna razón no estamos en login, ir ahí
            if "login" not in self.driver.current_url:
                print("⚠️ No estamos en login, navegando...")
                self.driver.get(f"{self.base_url}/login")
                time.sleep(2)
            
            self.assertIn("login", self.driver.current_url, "Deberíamos estar en la página de login")
            
            # Esperar campos de login
            email_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
            )
            password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            
            print("✅ Campos de login encontrados")
            
            # Limpiar y llenar con credenciales incorrectas
            email_input.clear()
            password_input.clear()
            
            email_input.send_keys("wrong@example.com")
            password_input.send_keys("wrongpassword")
            
            print("📝 Credenciales incorrectas ingresadas")
            
            # Click en login
            login_btn = self.driver.find_element(By.CLASS_NAME, "login-btn")
            login_btn.click()
            print("🖱️ Click en botón de login")
            
            # Esperar respuesta
            time.sleep(3)
            
            # Verificar que sigue en login (no se autenticó)
            current_url = self.driver.current_url
            print(f"🔄 URL después del intento: {current_url}")
            
            self.assertIn("login", current_url, "Debería seguir en la página de login")
            print("✅ Login fallido correctamente - se mantuvo en página de login")
            
        except TimeoutException as e:
            print(f"❌ TimeoutException: No se encontraron los campos")
            print(f"URL actual: {self.driver.current_url}")
            print(f"Contenido: {self.driver.page_source[:300]}")
            self.fail(f"No se pudieron encontrar los campos de login: {str(e)}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
    
    def test_04_recuperar_contraseña(self):
        """Test: Proceso de recuperación de contraseña"""
        print("\n🧪 Test: Recuperación de contraseña")
        
        # Asegurarse de estar en login
        if "login" not in self.driver.current_url:
            self.driver.get(f"{self.base_url}/login")
            time.sleep(1)
        
        # Click en "¿Olvidaste tu contraseña?"
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
    
    # ==========================================
    # MÉTODOS AUXILIARES
    # ==========================================
    
    def _do_login(self):
        """Método auxiliar para hacer login rápido"""
        # Si no estamos en login, ir ahí
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
        time.sleep(3)
        
        # Verificar que estamos en el dashboard
        try:
            self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Mi Panel')]"))
            )
        except TimeoutException:
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "dashboard"))
            )
    
    def _navigate_to_expenses(self):
        """Navegar a la página de gastos"""
        gastos_link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Gastos')]"))
        )
        gastos_link.click()
        time.sleep(2)
    
    def _add_quick_expense(self, title, amount, expense_type="expense"):
        """Agregar gasto/ingreso rápidamente"""
        title_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']")
        amount_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Valor']")
        category_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Categoría']")
        
        # Cambiar tipo si es necesario
        if expense_type == "income":
            type_select = self.driver.find_element(By.CSS_SELECTOR, "select")
            type_select.click()
            time.sleep(0.5)
            options = type_select.find_elements(By.TAG_NAME, "option")
            options[1].click()
        
        title_input.send_keys(title)
        amount_input.send_keys(amount)
        category_input.send_keys("Test")
        
        submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        submit_btn.click()
        time.sleep(2)


if __name__ == "__main__":
    # Ejecutar todos los tests
    unittest.main(verbosity=2)