from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class ExpensesPage(BasePage):
    """Página de Gestión de Gastos"""
    
    # Locators - Formulario
    TITLE_INPUT = (By.CSS_SELECTOR, "input[placeholder='Título (ej: Netflix)']")
    AMOUNT_INPUT = (By.CSS_SELECTOR, "input[placeholder='Valor']")
    CATEGORY_INPUT = (By.CSS_SELECTOR, "input[placeholder='Categoría']")
    TYPE_SELECT = (By.CSS_SELECTOR, "select")
    RECURRING_CHECKBOX = (By.CSS_SELECTOR, "input[type='checkbox']")
    RECURRENCE_DAY_INPUT = (By.CSS_SELECTOR, "input[type='number'][min='1'][max='31']")
    SUBMIT_BUTTON = (By.XPATH, "//button[contains(text(), 'Agregar')]")
    
    # Locators - Filtros
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[placeholder='Buscar...']")
    FILTER_SELECT = (By.CSS_SELECTOR, "select")
    RECURRING_BUTTON = (By.XPATH, "//button[contains(text(), 'Ver Recurrentes')]")
    PDF_BUTTON = (By.CLASS_NAME, "btn-pdf")
    
    # Locators - Tabla
    EXPENSE_TABLE = (By.CLASS_NAME, "expense-table")
    DELETE_BUTTONS = (By.XPATH, "//button[contains(text(), 'Eliminar')]")
    
    def __init__(self, driver):
        super().__init__(driver)
        self.url = "http://localhost:5173/gastos"
    
    def navigate(self):
        """Navegar a la página de gastos"""
        self.driver.get(self.url)
    
    # Métodos del formulario
    def enter_title(self, title):
        """Ingresar título"""
        self.send_keys(self.TITLE_INPUT, title)
    
    def enter_amount(self, amount):
        """Ingresar monto"""
        self.send_keys(self.AMOUNT_INPUT, str(amount))
    
    def enter_category(self, category):
        """Ingresar categoría"""
        self.send_keys(self.CATEGORY_INPUT, category)
    
    def select_type(self, expense_type="expense"):
        """Seleccionar tipo (expense/income)"""
        select = self.find_element(self.TYPE_SELECT)
        select.click()
        
        options = select.find_elements(By.TAG_NAME, "option")
        if expense_type == "income":
            options[0].click()
        else:
            options[1].click()
    
    def check_recurring(self, is_recurring=True):
        """Marcar/desmarcar como recurrente"""
        checkbox = self.find_element(self.RECURRING_CHECKBOX)
        if checkbox.is_selected() != is_recurring:
            checkbox.click()
    
    def set_recurrence_day(self, day):
        """Establecer día de recurrencia"""
        self.send_keys(self.RECURRENCE_DAY_INPUT, str(day))
    
    def click_submit(self):
        """Enviar formulario"""
        self.click(self.SUBMIT_BUTTON)
    
    def add_expense(self, title, amount, category, expense_type="expense", 
                   is_recurring=False, recurrence_day=None):
        """Agregar gasto/ingreso completo"""
        self.enter_title(title)
        self.enter_amount(amount)
        self.select_type(expense_type)
        self.enter_category(category)
        
        if is_recurring and recurrence_day:
            self.check_recurring(True)
            self.set_recurrence_day(recurrence_day)
        
        self.click_submit()
    
    # Métodos de filtros
    def search(self, text):
        """Buscar en la tabla"""
        self.send_keys(self.SEARCH_INPUT, text)
    
    def filter_by_type(self, filter_type="all"):
        """Filtrar por tipo"""
        selects = self.driver.find_elements(*self.FILTER_SELECT)
        if len(selects) > 1:
            filter_select = selects[1]
            filter_select.click()
            
            options = filter_select.find_elements(By.TAG_NAME, "option")
            if filter_type == "all":
                options[0].click()
            elif filter_type == "income":
                options[1].click()
            elif filter_type == "expense":
                options[2].click()
    
    def show_recurring_only(self):
        """Mostrar solo gastos recurrentes"""
        self.click(self.RECURRING_BUTTON)
    
    def export_pdf(self):
        """Exportar a PDF"""
        self.click(self.PDF_BUTTON)
    
    # Métodos de tabla
    def is_expense_in_table(self, title):
        """Verificar si un gasto está en la tabla"""
        table = self.find_element(self.EXPENSE_TABLE)
        return title in table.text
    
    def delete_last_expense(self):
        """Eliminar el último gasto de la tabla"""
        delete_buttons = self.driver.find_elements(*self.DELETE_BUTTONS)
        if delete_buttons:
            delete_buttons[-1].click()
            self.accept_alert()
