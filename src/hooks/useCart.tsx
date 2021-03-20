import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const [stock, setStock] = useState<Stock[]>([]);

  const addProduct = async (productId: number) => {
    try {
      const hasProduct = cart.findIndex(item => { return item.id === productId });
      const itemInStock = stock.findIndex(item => { return item.id === productId });

  
      if (hasProduct !== -1) {
        if (stock[itemInStock].amount <= cart[hasProduct].amount) {
          toast.error('Quantidade solicitada fora de estoque');
          
          return;
        }

        const updatedCart = cart.map(item => item.id === productId ? {
          ...item,
          amount: item.amount + 1
        } : item);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        setCart(updatedCart);

        return;
      }

      const { data } = await api.get(`/products/${productId}`);
      setCart([...cart, {
        ...data,
        amount: 1,
      }]);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {
        ...data,
        amount: 1,
      }]));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart: Product[] = [];
      
      cart.map(item => { 
        if (item.id !== productId ) {
          return updatedCart.push(item)
        }
        return null;
      });

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const itemInStock = stock.findIndex(item => { return item.id === productId });

      if (stock[itemInStock].amount  < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        
        return;
      }

      const updatedCart = cart.map(item => item.id === productId ? {
        ...item,
        amount: amount
      } : item);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);

      return;
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  useEffect(() => {
    async function loadStock() {
      const { data } = await api.get('/stock');

      setStock(data);
    }

    loadStock();
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
