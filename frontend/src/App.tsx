import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsViaRedux } from '.store/store';
import { ProductList } from './components/ProductList';
import { openIndexedDB } from './utils/db';