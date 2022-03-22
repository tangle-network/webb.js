import {Storage} from './storage';

export interface Hasher {
  hash(level: any, left: any, right: any): any;
}

interface TraverserHandler {
  handleIndex(level: number, elementIndex: number, siblingIndex: number): void;
}

class UpdateTraverser implements TraverserHandler {
  public originalElement: any;
  public keyValuesToPut: any = [];

  constructor(
    private prefix: string,
    private storage: Storage,
    private hasher: Hasher,
    public currentElement: any,
    private zeroValues: any
  ) {
  }

  static new(
    prefix: string,
    storage: Storage,
    hasher: Hasher,
    currentElement: any,
    zeroValues: any
  ): UpdateTraverser {
    return new UpdateTraverser(
      prefix,
      storage,
      hasher,
      currentElement,
      zeroValues,
    )
  }

  async handleIndex(level: number, elementIndex: number, siblingIndex: number) {
    if (level === 0) {
      this.originalElement = this.storage.getOrDefault(
        MerkleTree.keyFormat(this.prefix, level, elementIndex),
        this.zeroValues[level]
      );
    }
    const sibling = this.storage.getOrDefault(
      MerkleTree.keyFormat(this.prefix, level, siblingIndex),
      this.zeroValues[level]
    );
    let left, right;
    if (elementIndex % 2 === 0) {
      left = this.currentElement;
      right = sibling;
    } else {
      left = sibling;
      right = this.currentElement;
    }

    this.keyValuesToPut.push({
      key: MerkleTree.keyFormat(this.prefix, level, elementIndex),
      value: this.currentElement
    });
    this.currentElement = this.hasher.hash(level, left, right);
  }
}

class PathTraverser implements TraverserHandler {
  public pathElements: any[] = [];
  public pathIndex: number[] = [];

  constructor(private prefix: string, private storage: Storage, private zeroValues: any) {
  }

  handleIndex(level: number, elementIndex: number, siblingIndex: number) {
    const sibling = this.storage.getOrDefault(
      MerkleTree.keyFormat(this.prefix, level, siblingIndex),
      this.zeroValues[level]
    ) as any;
    this.pathElements.push(sibling);
    this.pathIndex.push(elementIndex % 2);
  }
}

export class MerkleTree {
  private zeroValues: string[] = [];
  private totalElements = 0;

  static keyFormat(prefix: string, level: number, index: number) {
    return `${prefix}_tree_${level}_${index}`;
  }

  static new(
    prefix: string,
    nLevel: number,
    defaultElements: any[] =[],
    hasher: Hasher,
    storage: Storage = new Storage(),
  ): MerkleTree {
    return new MerkleTree(prefix ,nLevel,defaultElements,hasher,storage)
  }

  constructor(
    private prefix: string,
    private nLevel: number,
    defaultElements: any[],
    private hasher: Hasher,
    private storage: Storage
  ) {
    let currentZeroValue = '21663839004416932945382355908790599225266501822907911457504978515578255421292';
    this.zeroValues.push(currentZeroValue);
    for (let i = 0; i < this.nLevel; i++) {
      currentZeroValue = this.hasher.hash(i, currentZeroValue, currentZeroValue);
      this.zeroValues.push(currentZeroValue.toString());
    }
    if (defaultElements) {
      let level = 0;
      this.totalElements = defaultElements.length;
      defaultElements.forEach((element, i) => {
        this.storage.put(MerkleTree.keyFormat(prefix, level, i), element);
      });
      level++;
      let numberOfElementsInLevel = Math.ceil(defaultElements.length / 2);
      for (level; level <= this.nLevel; level++) {
        for (let i = 0; i < numberOfElementsInLevel; i++) {
          const leftKey = MerkleTree.keyFormat(prefix, level - 1, 2 * i);
          const rightKey = MerkleTree.keyFormat(prefix, level - 1, 2 * i + 1);

          const left = this.storage.get(leftKey);
          const right = this.storage.getOrDefault(rightKey, this.zeroValues[level - 1]);

          const subRoot = this.hasher.hash(null, left, right);
          this.storage.put(MerkleTree.keyFormat(prefix, level, i), subRoot);
        }
        numberOfElementsInLevel = Math.ceil(numberOfElementsInLevel / 2);
      }
    }
  }

  traverse(index: number, handler: TraverserHandler) {
    let currentIndex = index;
    for (let i = 0; i < this.nLevel; i++) {
      let siblingIndex = currentIndex;
      if (currentIndex % 2 === 0) {
        siblingIndex += 1;
      } else {
        siblingIndex -= 1;
      }
      handler.handleIndex(i, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }

  update(index: number, element: any, insert = false) {
    if (!insert && index >= this.totalElements) {
      throw Error('Use insert method for new elements.');
    } else if (insert && index < this.totalElements) {
      throw Error('Use update method for existing elements.');
    }
    try {
      const traverser = UpdateTraverser.new(this.prefix, this.storage, this.hasher, element, this.zeroValues);

      this.traverse(index, traverser);
      traverser.keyValuesToPut.push({
        key: MerkleTree.keyFormat(this.prefix, this.nLevel, 0),
        value: traverser.currentElement
      });

      this.storage.put_batch(traverser.keyValuesToPut);
    } catch (e) {
      console.error(e);
    }
  }

  getRoot(): string {
    const root = this.storage.getOrDefault(
      MerkleTree.keyFormat(this.prefix, this.nLevel, 0),
      this.zeroValues[this.nLevel]
    ) as string;
    return root;
  }

  // Elements must be ordered
  batchInsert(elements: any[]) {
    elements.forEach((elem) => {
      this.insert(elem);
    });
  }

  insert(element: any) {
    const index = this.totalElements;
    this.update(index, element, true);
    this.totalElements++;
  }

  path(index: number) {
    const traverser = new PathTraverser(this.prefix, this.storage, this.zeroValues);
    const root = this.storage.getOrDefault(
      MerkleTree.keyFormat(this.prefix, this.nLevel, 0),
      this.zeroValues[this.nLevel]
    );

    const element = this.storage.getOrDefault(MerkleTree.keyFormat(this.prefix, 0, index), this.zeroValues[0]);

    this.traverse(index, traverser);
    return {
      root,
      pathElements: traverser.pathElements,
      pathIndex: traverser.pathIndex,
      element
    };
  }

  getIndexOfElement(element: any): number {
    for (let i = 0; i < this.totalElements; i++) {
      if (this.storage.get(MerkleTree.keyFormat(this.prefix, 0, i)) === element) {
        return i;
      }
    }
    return -1;
  }

  getLeaves(): any[] {
    const leaves = [];

    for (let i = 0; i < this.totalElements; i++) {
      leaves.push(this.storage.get(MerkleTree.keyFormat(this.prefix, 0, i)));
    }

    return leaves;
  }
}
