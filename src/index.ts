// Copyright (c) 2023-present Vadim Glinka
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option.

import {
  StorageInterface,
  type Setup,
  defaultStorageName,
  Ok,
} from 'storage-facade';

export const defaultUseCache = false;
export const defaultAsyncMode = false;

export class SessionStorageThin extends StorageInterface {
  interfaceName = 'SessionStorageThin';

  storageName = '';

  useCache: boolean = defaultUseCache;

  asyncMode: boolean = defaultAsyncMode;

  keyValueCache = new Map<string, unknown>();

  isDeleted = false;

  defaultAsyncMode(): boolean {
    return this.asyncMode;
  }

  checkStorage(): void {
    if (this.isDeleted) throw Error('This Storage was deleted!');
  }

  initSync<T extends StorageInterface>(setup: Setup<T>): Error | Ok {
    this.storageName = setup.name ?? defaultStorageName;
    this.useCache = (setup.useCache as boolean) ?? defaultUseCache;
    return new Ok();
  }

  getItemSync(key: string): unknown {
    this.checkStorage();
    if (this.useCache && this.keyValueCache.has(key)) {
      return structuredClone(this.keyValueCache.get(key));
    }
    const valueStr = window.sessionStorage.getItem(key);
    if (valueStr === null || valueStr === 'undefined') {
      return undefined;
    }
    if (valueStr === 'null') {
      return null;
    }
    const value = JSON.parse(valueStr) as unknown;
    // Update keyValue cache
    if (this.useCache) {
      this.keyValueCache.set(key, structuredClone(value));
    }
    return value;
  }

  setItemSync(key: string, value: unknown): void {
    this.checkStorage();
    // Update storage
    window.sessionStorage.setItem(key, JSON.stringify(value));
    // Update keyValue cache
    if (this.useCache) {
      this.keyValueCache.set(key, structuredClone(value));
    }
  }

  removeItemSync(key: string): void {
    this.checkStorage();
    // Delete key from storage
    window.sessionStorage.removeItem(key);
    // Update cache
    if (this.useCache) {
      this.keyValueCache.delete(key);
    }
  }

  clearSync(): void {
    this.checkStorage();
    // Update storage
    window.sessionStorage.clear();
    // Update cache
    if (this.useCache) {
      this.keyValueCache.clear();
    }
  }

  sizeSync(): number {
    this.checkStorage();
    return window.sessionStorage.length;
  }

  keySync(index: number): string | undefined {
    this.checkStorage();
    const key = window.sessionStorage.key(index);
    return key === null ? undefined : key;
  }

  deleteStorageSync(): void {
    this.checkStorage();
    this.clearSync();
    this.isDeleted = true;
  }
}
