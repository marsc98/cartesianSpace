import { describe, it, expect, vi, beforeEach } from 'vitest'
import resourcePool from './resourcePool'

describe('ResourcePool', () => {
  beforeEach(() => {
    resourcePool.cleanup()
  })

  describe('geometrias', () => {
    it('retorna a mesma instância para a mesma chave (circle)', () => {
      const g1 = resourcePool.getCircleGeometry(16)
      const g2 = resourcePool.getCircleGeometry(16)
      expect(g1).toBe(g2)
    })

    it('retorna instâncias diferentes para segmentos diferentes (circle)', () => {
      const g1 = resourcePool.getCircleGeometry(16)
      const g2 = resourcePool.getCircleGeometry(32)
      expect(g1).not.toBe(g2)
    })

    it('retorna a mesma instância para cube', () => {
      const g1 = resourcePool.getCubeGeometry()
      const g2 = resourcePool.getCubeGeometry()
      expect(g1).toBe(g2)
    })

    it('retorna a mesma instância para sphere com mesmos segmentos', () => {
      const g1 = resourcePool.getSphereGeometry(16, 16)
      const g2 = resourcePool.getSphereGeometry(16, 16)
      expect(g1).toBe(g2)
    })

    it('retorna instâncias diferentes para sphere com segmentos diferentes', () => {
      const g1 = resourcePool.getSphereGeometry(16, 16)
      const g2 = resourcePool.getSphereGeometry(32, 32)
      expect(g1).not.toBe(g2)
    })
  })

  describe('materiais', () => {
    it('retorna o mesmo material para a mesma cor e opacidade', () => {
      const m1 = resourcePool.getBasicMaterial('#ff0000', 0.9)
      const m2 = resourcePool.getBasicMaterial('#ff0000', 0.9)
      expect(m1).toBe(m2)
    })

    it('retorna materiais diferentes para cores diferentes', () => {
      const m1 = resourcePool.getBasicMaterial('#ff0000')
      const m2 = resourcePool.getBasicMaterial('#00ff00')
      expect(m1).not.toBe(m2)
    })

    it('retorna materiais diferentes para opacidades diferentes', () => {
      const m1 = resourcePool.getBasicMaterial('#ff0000', 0.5)
      const m2 = resourcePool.getBasicMaterial('#ff0000', 1.0)
      expect(m1).not.toBe(m2)
    })
  })

  describe('cleanup()', () => {
    it('retorna o número de recursos limpos', () => {
      resourcePool.getCircleGeometry(32)
      resourcePool.getCubeGeometry()
      resourcePool.getBasicMaterial('#ff0000')

      const cleaned = resourcePool.cleanup()
      expect(cleaned).toBe(3)
    })

    it('após cleanup, cria nova instância de geometria para a mesma chave', () => {
      const before = resourcePool.getCircleGeometry(32)
      resourcePool.cleanup()
      const after = resourcePool.getCircleGeometry(32)
      expect(before).not.toBe(after)
    })

    it('chama dispose() nas geometrias ao limpar', () => {
      const geometry = resourcePool.getCircleGeometry(32)
      const disposeSpy = vi.spyOn(geometry, 'dispose')
      resourcePool.cleanup()
      expect(disposeSpy).toHaveBeenCalledOnce()
    })

    it('chama dispose() nos materiais ao limpar', () => {
      const material = resourcePool.getBasicMaterial('#ffffff')
      const disposeSpy = vi.spyOn(material, 'dispose')
      resourcePool.cleanup()
      expect(disposeSpy).toHaveBeenCalledOnce()
    })
  })

  describe('getStats()', () => {
    it('retorna total correto de recursos', () => {
      resourcePool.getCircleGeometry(32)
      resourcePool.getCubeGeometry()
      resourcePool.getBasicMaterial('#ff0000')

      const stats = resourcePool.getStats()
      expect(stats.totalResources).toBe(3)
      expect(stats.geometries.total).toBe(2)
      expect(stats.materials.total).toBe(1)
    })

    it('começa com zero recursos após cleanup', () => {
      resourcePool.cleanup()
      const stats = resourcePool.getStats()
      expect(stats.totalResources).toBe(0)
    })
  })
})
