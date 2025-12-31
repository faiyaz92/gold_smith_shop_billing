// src/app/utils/firestorePaths.js
import { useMemo } from 'react';

export const getCompanyId = () => {
  return process.env.NEXT_PUBLIC_COMPANY_ID || '';
};

export const useFirestorePaths = () => {
  const companyId = getCompanyId();
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return useMemo(() => ({
    getBasePath: () => basePath,
    getSuperAdminPath: () => `${basePath}/superAdmins`,
    getCommonUsersPath: () => `${basePath}/users`,
    getTenantCompanyPath: () => `${tenantCompaniesPath}/${companyId}`,
    getTenantUsersPath: () => `${tenantCompaniesPath}/${companyId}/users`,
    getTenantUserPath: (userId) => `${tenantCompaniesPath}/${companyId}/users/${userId}`,
    getCustomerCompanyPath: () => `${tenantCompaniesPath}/${companyId}/companies`,
    getSingleCustomerCompanyPath: (customerCompanyId) => `${tenantCompaniesPath}/${companyId}/companies/${customerCompanyId}`,
    getTaskCollectionPath: () => `${tenantCompaniesPath}/${companyId}/tasks`,
    getSingleTaskPath: (taskId) => `${tenantCompaniesPath}/${companyId}/tasks/${taskId}`,
    getProductPath: () => `${tenantCompaniesPath}/${companyId}/products`,
    getCategoryPath: () => `${tenantCompaniesPath}/${companyId}/categories`,
    getSubcategoryPath: () => `${tenantCompaniesPath}/${companyId}/subcategories`,
    getStoresPath: () => `${tenantCompaniesPath}/${companyId}/stores`,
    getStockPath: (storeId) => `${tenantCompaniesPath}/${companyId}/stores/${storeId}/stock`,
    getTransactionsPath: (storeId) => `${tenantCompaniesPath}/${companyId}/stores/${storeId}/transactions`,
    getAccountLedgerPath: () => `${tenantCompaniesPath}/${companyId}/accountLedgers`,
    getAccountLedgerRef: (ledgerId) => `${tenantCompaniesPath}/${companyId}/accountLedgers/${ledgerId}`,
    getTransactionsRef: (ledgerId) => `${tenantCompaniesPath}/${companyId}/accountLedgers/${ledgerId}/transactions`,
    getOrdersPath: () => `${tenantCompaniesPath}/${companyId}/orders`,
    getSingleOrderPath: (orderId) => `${tenantCompaniesPath}/${companyId}/orders/${orderId}`,
    getInvoicesPath: () => `${tenantCompaniesPath}/${companyId}/invoices`,
    getSingleInvoicePath: (invoiceId) => `${tenantCompaniesPath}/${companyId}/invoices/${invoiceId}`,
    getInvoiceItemsPath: () => `${tenantCompaniesPath}/${companyId}/invoiceItems`,
    getCartsPath: () => `${tenantCompaniesPath}/${companyId}/carts`,
    getUserCartPath: (userId) => `${tenantCompaniesPath}/${companyId}/carts/${userId}`,
    getWishlistPath: () => `${tenantCompaniesPath}/${companyId}/wishlists`,
    getUserWishlistPath: (userId) => `${tenantCompaniesPath}/${companyId}/wishlists/${userId}`,
    getTaxiBookingsPath: () => `${tenantCompaniesPath}/${companyId}/taxiBookings`,
    getTaxiTypesPath: () => `${tenantCompaniesPath}/${companyId}/settings/taxiBookingSettings/taxiTypes`,
    getTripTypesPath: () => `${tenantCompaniesPath}/${companyId}/settings/taxiBookingSettings/tripTypes`,
    getServiceTypesPath: () => `${tenantCompaniesPath}/${companyId}/settings/taxiBookingSettings/serviceTypes`,
    getTripStatusesPath: () => `${tenantCompaniesPath}/${companyId}/settings/taxiBookingSettings/tripStatuses`,
    getTaxiBookingSettingsPath: () => `${tenantCompaniesPath}/${companyId}/settings/taxiBookingSettings`,
    getVisitorCountersPath: () => `${tenantCompaniesPath}/${companyId}/analytics/visitorCounters/daily`,
    getUserAddressesPath: (userId) => `${tenantCompaniesPath}/${companyId}/users/${userId}/addresses`,
    getSettingsPath: () => `${tenantCompaniesPath}/${companyId}/settings/general`,
    getInventoryPath: () => `${tenantCompaniesPath}/${companyId}/inventory`,
    getInventoryItemPath: (productId) => `${tenantCompaniesPath}/${companyId}/inventory/${productId}`,
  }), [companyId]);
};
